export type ContactFormType = {
  name: string;
  email?: string;
  phone: string;
  message: string;
  contactPreference: 'phone' | 'email';
}

export type ProductType = {
    id: number;
    name: string;
    description?: string | null;
    category?: string | null;
    price: number;
    discount?: number | null;
    outOfStock: boolean;
    images?: Array<{
        id: string;
        url: string;
        altText?: string | null;
        thumbnailUrl?: string | null;
        width: number;
        height: number;
        focalX?: number | null;
        focalY?: number | null;
        sizes?: { [key: string]: {
            url: string | null;
            width: number | null;
            height: number | null;
            mimeType: string | null;
            filesize: number | null;
            filename: string | null;
        }
        }
    }> | null;
    createdAt: string;
    updatedAt: string;
}