export default class Selection {
    private set = new Set<string>();
    private constructor(private dflt: boolean, values: Iterable<string>) {
        this.set = new Set(values);
    }

    /** includes checks if the selecion includes the given key */
    includes(key: string): boolean {
        if (this.set.has(key)) {
            return !this.dflt;
        }
        return this.dflt;
    }

    /** with returns a new selection with the specified key set to the specified value */
    with(pairs: Array<[string, boolean]>): Selection {
        const set = new Set(this.set);
        
        pairs.forEach(([key, value]) => {
            if (value === this.dflt) {
                set.delete(key)
            } else {
                set.add(key)
            }
        })

        return new Selection(this.dflt, set);
    }

    toggle(value: string) {
        const set = new Set(this.set);

        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }

        return new Selection(this.dflt, set);
    }

    static none(): Selection {
        return new Selection(false, []);
    }
    static all(): Selection {
        return new Selection(true, []);
    }
}