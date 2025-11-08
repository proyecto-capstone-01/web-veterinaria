export async function submitContactForm(payload: {
  name: string
  email: string
  phone: string
  message: string
  contactPreference: "email" | "phone"
}) {
  try {
    const baseUrl = import.meta.env.PUBLIC_CMS_URL || "http://localhost:3000"
    
    const res = await fetch(`${baseUrl}/api/contact-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Error al enviar formulario")
    }

    return await res.json()
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}