import { Ticket } from '../model/Ticket';
import { Station } from './model/Stations'; // Đảm bảo import đúng đường dẫn

// Định nghĩa kiểu cho các tham số của từng màn hình
export type RootStackParamList = {
  MainScreen: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForgotPasswordScreen: undefined;
  UserInfoScreen: undefined;
  HelpScreen: undefined;
  ChangePasswordScreen: undefined;
  SeatScreen: { tripId: string };
  PaymentScreen: {
    paymentUrl: string;
    paymentMethod: string;
  };
  TripSummaryScreen: { 
    selectedSeats: string[]; 
    tripDetails: any; 
    seatIndices: number[];
    totalPrice: number
  };
  TicketDetailScreen:{
    ticket: Ticket
  };
  TripScreen: {
    startStation: Station;
    endStation: Station;
    date: string;
  };
};