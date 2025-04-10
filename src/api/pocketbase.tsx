import PocketBase from "pocketbase";
const url = import.meta.env.VITE_POCKETBASE_URL;

const Pb = new PocketBase(url)

export default Pb