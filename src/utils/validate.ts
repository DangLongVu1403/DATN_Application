export const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
};
export const isValidPassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};
  
export const isPasswordMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
};
  