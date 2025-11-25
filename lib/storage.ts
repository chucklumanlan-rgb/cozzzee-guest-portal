import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadString,
} from "firebase/storage";
import { storage } from "./firebase";

export async function uploadPassport(reservationId: string, file: File) {
  const fileRef = ref(storage, `passports/${reservationId}.jpg`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return await getDownloadURL(fileRef);
}

export async function uploadSignature(
  reservationId: string,
  base64: string
) {
  const sigRef = ref(storage, `signatures/${reservationId}.png`);
  await uploadString(sigRef, base64, "data_url");
  return await getDownloadURL(sigRef);
}