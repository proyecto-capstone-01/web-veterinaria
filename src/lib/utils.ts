import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function whatsappRedirect(phoneNumber: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

export function rutValidator(rut: string): boolean {
    // Clean the RUT by removing dots and hyphen
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();

    // Split the RUT into number and verifier
    const rutBody = cleanRut.slice(0, -1);
    const verifier = cleanRut.slice(-1);

    let sum = 0;
    let multiplier = 2;

    // Calculate the sum for the verifier
    for (let i = rutBody.length - 1; i >= 0; i--) {
      sum += parseInt(rutBody.charAt(i), 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const calculatedVerifier = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();

        // Compare the calculated verifier with the provided verifier
    return calculatedVerifier === verifier;
}