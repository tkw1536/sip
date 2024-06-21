/** Used to coordinate a set of function calls */
export class Operation {
    private id = 0
    
    /** ticket returns a function which returns true while ticket and cancel are not called again */
    ticket(): () => boolean {
        const myID = ++this.id
        return (): boolean => myID === this.id
    }

    /** cancel cancels any ongoing tickets */
    cancel(): void {
        this.id++
    }
}
