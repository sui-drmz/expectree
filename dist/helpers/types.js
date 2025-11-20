export function snapshotIsBinary(snapShot) {
    return snapShot.type === 'AND' || snapShot.type === 'OR';
}
export function snapshotIsUnary(snapShot) {
    return snapShot.type === 'NOT' || snapShot.type === 'GROUP';
}
