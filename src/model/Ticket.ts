export interface Ticket {
    _id: string;
    trip: {
      estimatedTravelTime: {
        hours: number;
        minutes: number;
      };
      bus: {
        licensePlate: string;
        seatCapacity: Number;
      };
      driver: {
        name: string;
      };
      startLocation: {
        name: string;
      }
      endLocation: {
        name: string;
      }
      departureTime: string;
      arriveTime: string;
      price: number;
    };
    seatNumber: number;
    paymentStatus: string;
    paymentMethod: string;
    status: string;
    issuedAt: string;
  }