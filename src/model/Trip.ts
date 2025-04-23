export interface Trip {
    _id: string;
    bus: { _id: string; seatCapacity: number };
    driver: string;
    startLocation:{_id: string; name: string};
    endLocation: {_id: string; name: string};
    departureTime: Date;
    arriveTime: Date;
    price: number;
    availableSeats: number;
    estimatedTravelTime: { hours: number; minutes: number };
    bookedPhoneNumbers: string[];
    createdAt: Date;
    updatedAt: Date;
}