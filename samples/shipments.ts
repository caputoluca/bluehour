// Every syntax role a TypeScript theme has to colour, in one file.
/**
 * Shipment records for a pallet-recycling yard: a list row, a detail
 * object, and the service that reads them. Mirrors the real portal.
 * @see https://example.com/docs/shipments
 */
import type { Db } from "@yard/db/client";
import { errors } from "@yard/domain/error";
import { z } from "zod";
import { guarded } from "./guarded.ts";

export const ShipmentStatus = {
	draft: "draft",
	counted: "counted",
	completed: "completed",
} as const;
export type ShipmentStatus =
	(typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export interface ShipmentSummary {
	readonly id: string;
	documentNumber: number;
	status: ShipmentStatus;
	serviceDate: Date | null;
	totalCents: bigint;
	lines?: ReadonlyArray<{ quantity: number }>;
}

export const listShipmentsInputSchema = z.object({
	customerId: z.string().uuid(),
	page: z.number().int().min(1).default(1),
	direction: z.enum(["inbound", "outbound"]).optional(),
});
export type ListShipmentsInput = z.infer<typeof listShipmentsInputSchema>;

type Page<T> = { items: T[]; total: number; hasMore: boolean };

const PAGE_SIZE = 25;
const DOCUMENT_PATTERN = /^BOL-(\d{6})$/i;
const MAX_LINES = 0x40;
const TAX_RATE = 0.0875;

export class ShipmentService {
	readonly #db: Db;
	private cache = new Map<string, ShipmentSummary>();

	constructor(db: Db) {
		this.#db = db;
	}

	/** Formats `12` as `BOL-000012`. */
	static formatDocumentNumber(n: number): string {
		return `BOL-${String(n).padStart(6, "0")}`;
	}

	async list(
		input: ListShipmentsInput,
		actor: Actor,
	): Promise<Page<ShipmentSummary>> {
		const { customerId, page } = listShipmentsInputSchema.parse(input);
		const scope = guarded(actor, customerId);
		let rows: ShipmentSummary[] = [];
		try {
			rows = await this.#db.shipment.findMany({
				where: { ...scope, direction: input.direction ?? undefined },
				skip: (page - 1) * PAGE_SIZE,
				take: PAGE_SIZE + 1,
			});
		} catch (err: unknown) {
			if (err instanceof Error && err.message.includes("timeout")) {
				throw errors.unavailable("shipments", err);
			}
			throw err;
		}
		for (const row of rows) this.cache.set(row.id, row);
		return {
			items: rows.slice(0, PAGE_SIZE),
			total: rows.length,
			hasMore: rows.length > PAGE_SIZE,
		};
	}

	total(summary: ShipmentSummary): number {
		const cents = Number(summary.totalCents);
		switch (summary.status) {
			case ShipmentStatus.completed:
				return Math.round(cents * (1 + TAX_RATE));
			case "draft":
				return 0;
			default:
				return cents;
		}
	}
}

export function parseDocumentNumber(value: string): number | undefined {
	const match = DOCUMENT_PATTERN.exec(value.trim());
	return match ? Number.parseInt(match[1] ?? "", 10) : undefined;
}

export const isOverLimit = (lines: readonly unknown[]) =>
	lines.length > MAX_LINES;

interface Actor {
	id: string;
	role: "office" | "provider" | "driver";
}
