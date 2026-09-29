/** The hour after sunset, when the sky is deeper than the room. */
import type { Lamp, Room, Sky } from "./room.ts";
import { horizon } from "./horizon.ts";

type Scene<T> = { lit: T[]; sky: Sky; quiet: boolean };

const DUSK = "18:30";
const CLOCK = /^(\d{2}):(\d{2})$/;
const SKY_BLUE = 0x344f6d;
const CANDLE = 2700;

export class BlueHour {
	readonly #room: Room;
	private lamps = new Map<string, Lamp>();

	constructor(room: Room) {
		this.#room = room;
	}

	/** Ceiling off, every lamp warm, the sky as it is at half past six. */
	async settle(lamps: Lamp[], at = DUSK): Promise<Scene<Lamp>> {
		const sky = await horizon.at(BlueHour.hour(at));
		this.#room.ceiling.off();
		for (const lamp of lamps) {
			lamp.warm(CANDLE);
			this.lamps.set(lamp.name, lamp);
		}
		const lit = [...this.lamps.values()].filter((lamp) => lamp.on);
		return { lit, sky, quiet: sky.colour === SKY_BLUE && lit.length >= 5 };
	}

	/** `"18:30"` as hours past midnight, `18.5`. */
	static hour(time: string): number {
		const [, h, m] = CLOCK.exec(time) ?? [];
		return Number(h) + Number(m) / 60;
	}

	toString(): string {
		return `blue hour at ${DUSK}: ${this.lamps.size} lamps on, ceiling off`;
	}
}
