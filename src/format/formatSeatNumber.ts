export const formatSeatNumber = (
    seatIndex: number,
    totalSeats: number,
    bookedPhoneNumbers: string[]
): { seatNumber: string; isBooked: boolean; floor: number } => {
    let seatsPerFloor = totalSeats / 2;
    let numColumns = 3;

    if (totalSeats === 20) {
        seatsPerFloor = 10;
        numColumns = 2;
    } else if (totalSeats === 36) {
        seatsPerFloor = 18;
    } else if (totalSeats === 42) {
        seatsPerFloor = 21;
    }

    if (totalSeats === 20) {
        const floor1Indices = [1, 2, 5, 6, 9, 10, 13, 14, 17, 18];
        const floor2Indices = [3, 4, 7, 8, 11, 12, 15, 16, 19, 20];

        let floor, floorSeatIndex;
        if (floor1Indices.includes(seatIndex)) {
            floor = 1;
            floorSeatIndex = floor1Indices.indexOf(seatIndex);
        } else {
            floor = 2;
            floorSeatIndex = floor2Indices.indexOf(seatIndex);
        }

        const row = Math.floor(floorSeatIndex / numColumns) + 1;
        const col = floorSeatIndex % numColumns;
        const colLabel = String.fromCharCode(65 + col);
        const seatNumber = `${colLabel}${row}-T${floor}`;
        const isBooked = bookedPhoneNumbers[seatIndex] !== null && bookedPhoneNumbers[seatIndex] !== "";

        return { seatNumber, isBooked, floor };
    } else {
        const groupIndex = Math.floor(seatIndex / 6);
        const positionInGroup = seatIndex % 6;
        const floor = positionInGroup < 3 ? 1 : 2;

        const floorSeatIndex =
            floor === 1
                ? Math.floor(seatIndex / 6) * 3 + (seatIndex % 3)
                : Math.floor((seatIndex - 3) / 6) * 3 + ((seatIndex - 3) % 3);
        const row = Math.floor(floorSeatIndex / numColumns) + 1;
        const col = floorSeatIndex % numColumns;
        const colLabel = String.fromCharCode(67 - col);
        const seatNumber = `${colLabel}${row}-T${floor}`;
        const isBooked = bookedPhoneNumbers[seatIndex] !== null && bookedPhoneNumbers[seatIndex] !== "";

        return { seatNumber, isBooked, floor };
    }
};