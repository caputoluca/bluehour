import { useMemo, useState } from "react";
import type { ShipmentSummary } from "./shipments.ts";
import { ShipmentService, ShipmentStatus } from "./shipments.ts";

type Props = {
	shipments: ShipmentSummary[];
	onOpen?: (id: string) => void;
	dense?: boolean;
};

const statusLabel: Record<string, string> = {
	[ShipmentStatus.draft]: "Draft",
	[ShipmentStatus.counted]: "Counted",
	[ShipmentStatus.completed]: "Completed",
};

export function ShipmentTable({ shipments, onOpen, dense = false }: Props) {
	const [query, setQuery] = useState("");
	const visible = useMemo(
		() => shipments.filter((s) => ShipmentService.formatDocumentNumber(s.documentNumber).includes(query)),
		[shipments, query],
	);

	if (visible.length === 0) {
		return <p className="empty">No shipments match “{query}”.</p>;
	}

	return (
		<section className={dense ? "table dense" : "table"} aria-label="Shipments">
			<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="BOL-000012" />
			<table>
				<thead>
					<tr>
						<th scope="col">Document</th>
						<th scope="col">Status</th>
						<th scope="col" style={{ textAlign: "right" }}>Total</th>
					</tr>
				</thead>
				<tbody>
					{visible.map((s) => (
						<tr key={s.id} onClick={() => onOpen?.(s.id)}>
							<td>{ShipmentService.formatDocumentNumber(s.documentNumber)}</td>
							<td>
								<Badge tone={s.status === "completed" ? "done" : "open"}>{statusLabel[s.status]}</Badge>
							</td>
							<td className="num">{(Number(s.totalCents) / 100).toFixed(2)}</td>
						</tr>
					))}
				</tbody>
			</table>
			{/* Footer shows the count; keep it tabular. */}
			<footer>{visible.length} of {shipments.length}</footer>
		</section>
	);
}

function Badge({ tone, children }: { tone: "done" | "open"; children: React.ReactNode }) {
	return <span className={`badge badge-${tone}`}>{children}</span>;
}
