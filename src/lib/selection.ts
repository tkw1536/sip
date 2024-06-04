export default class Selection {
    private map = new Map<string, boolean>();
    private constructor(private dflt: boolean, values: Iterable<[string, boolean]>) {
        this.map = new Map(values);
    }

    /** includes checks if the selecion includes the given key */
    includes(key: string): boolean {
        if(this.map.has(key)) {
            return this.map.get(key)
        }
        return this.dflt;
    }

    /** with returns a new selection with the specified key set to the specified value */
    with(pairs: Array<[string, boolean]>): Selection {
        const mp = new Map(this.map);

        pairs.forEach(([key, value]) => {
            if (value === this.dflt) {
                mp.delete(key)
            } else {
                mp.set(key, value)
            }
        })

        return new Selection(this.dflt, mp);
    }

    static none(): Selection {
        return new Selection(false, []);
    }
    static all(): Selection {
        return new Selection(true, []);
    }
}