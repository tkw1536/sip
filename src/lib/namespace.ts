export class NamespaceMap {
    private elements = new Map<string, string>();
    private reverse = new Map<string, string>();
    /** add adds a new version of short to this namespace map*/
    add(long: string, short: string) {
        if (short === "") return; // ignore empty prefix

        this.remove(long);

        this.elements.set(long, short);
        this.reverse.set(short, long)
    }

    /** remove removes a prefix from this namespace map */
    remove(short: string) {
        if (!this.reverse.has(short)) {
            return
        }

        const long = this.reverse.get(short)!;
        this.reverse.delete(short);
        this.elements.delete(long);
    }

    /** apply applies this namespace-map to a string */
    apply(uri: string): string {
        const prefix = this.prefix(uri);
        if (prefix === "") return uri;
        return this.elements.get(prefix) + ":" + uri.substring(prefix.length);
    }

    /** prefix returns the longest prefix of uri for which a namespace is contained within this map */
    prefix(uri: string): string {
        let prefix = "";     // prefix used
        this.elements.forEach((short, long) => {
            // must actually be a prefix
            if (!uri.startsWith(long)) {
                return;
            }

            // if we already have a shorter prefix
            // then don't apply it at all!
            if (prefix != "" && (long <= prefix)) {
                return;
            }
            prefix = long;
        });
        return prefix;
    }

    /** returns a map from long => short **/
    toMap(): Map<string, string> {
        return new Map(this.elements);
    }

    /** creates a new namespace map from the given map */
    static fromMap(elements: Map<string, string>): NamespaceMap {
        const ns = new NamespaceMap();
        elements.forEach((short, long) => ns.add(long, short));
        return ns 
    }

    /** generate automatically generates a prefix map */
    static generate(uris: Set<string>, separators: string = "/#", len = 30): NamespaceMap {
        const prefixes = new Set<string>();
        uris.forEach(uri => {
            if (uri === "") {
                return;
            }

            const until = Math.max(...Array.from(separators).map(c => uri.lastIndexOf(c)));
            // no valid prefix
            if (until === -1) {
                return;
            }

            // compute the prefix
            const prefix = uri.substring(0, until + 1);

            // we already have a prefix
            if (prefixes.has(prefix)) {
                return;
            }

            let hadPrefix = false;
            prefixes.forEach(old => {
                // we have a prefix that is longer
                // so delete it
                if (old.startsWith(prefix)) {
                    prefixes.delete(old);
                }

                // we had a subset of this one already
                // so don't add it!
                if (prefix.startsWith(old)) {
                    hadPrefix = true;
                }
            })

            // don't add the prefix
            if (hadPrefix) {
                return;
            }
            prefixes.add(prefix);
        })

        const ns = new NamespaceMap();

        const seen = new Map<string, number>();
        prefixes.forEach(prefix => {
            const name = (prefix.indexOf('://') >= 0) ? prefix.substring(prefix.indexOf('://') + '://'.length) : prefix;
            const match = (name.match(/([a-zA-Z0-9]+)/g) ?? []).find(v => v !== "www") ?? "prefix";
            
            let theName = match.substring(0, len);
            if (seen.has(theName)) {
                const counter = seen.get(theName)!;
                seen.set(theName, counter + 1);
                theName = `${theName}_${counter}`;
            } else {
                seen.set(theName, 1);
            }

            ns.add(prefix, theName); // TODO: smarter prefixing
        })
        return ns;
    }

}