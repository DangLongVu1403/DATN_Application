import { IP_ADDRESS, PORT } from "@env";

const BASE_URL = `http://${IP_ADDRESS}:${PORT}/api`;
const URL = `http://${IP_ADDRESS}:${PORT}`;

console.log(`Đang sử dụng API URL: ${BASE_URL}`);

export { URL };
export default BASE_URL;