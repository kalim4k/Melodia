
import { User } from "../types";

// === CONFIGURATION ===
export const MAKETOU_PRODUCT_ID = "6532ae48-b405-4219-bde2-5aaf08985c6e"; 

const API_KEY = "msk_9c0ce015188f9f3f19041db0d3a2b5d0533444920f63212f32bf8de2bd2ca867";
const BASE_URL = "https://api.maketou.net/api/v1/stores";

interface CreateCartResponse {
  cart: {
    id: string;
    status: string;
  };
  redirectUrl: string;
}

interface CartStatusResponse {
  id: string;
  status: string; // Changé en string simple pour être plus permissif
  meta?: {
    userId?: string;
    coinAmount?: number;
  };
  customerPrice?: number;
  cart?: {
      customerPrice?: number;
  }
}

export const initiateMaketouPayment = async (
  user: User, 
  amountFCFA: number, 
  coinAmount: number
): Promise<string> => {
  
  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Melodia';

  // URL de redirection absolue
  const redirectURL = `${window.location.origin}?payment_verification=true`;

  const payload = {
    productDocumentId: MAKETOU_PRODUCT_ID,
    customerPrice: amountFCFA, 
    email: user.email,
    firstName: firstName,
    lastName: lastName,
    redirectURL: redirectURL,
    meta: {
      userId: user.email, 
      coinAmount: coinAmount
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/cart/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur init paiement");
    }

    const data: CreateCartResponse = await response.json();
    
    if (data && data.cart && data.cart.id) {
        localStorage.setItem('pending_cart_id', data.cart.id);
    } else {
        throw new Error("Réponse Maketou invalide (pas d'ID de panier)");
    }

    return data.redirectUrl;
  } catch (error) {
    console.error("Erreur service paiement:", error);
    throw error;
  }
};

export const verifyMaketouPayment = async (cartId: string): Promise<CartStatusResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/cart/${cartId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn("Maketou verification status:", response.status);
      return { id: cartId, status: 'waiting_payment' };
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur vérification paiement:", error);
    return { id: cartId, status: 'waiting_payment' };
  }
};

// Helper pour normaliser le statut car Maketou peut changer ses codes
export const isPaymentSuccessful = (status: string): boolean => {
    const s = status.toLowerCase();
    return s === 'completed' || s === 'success' || s === 'paid' || s === 'payment_success';
};
