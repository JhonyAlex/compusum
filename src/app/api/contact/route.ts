import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/contact - Submit contact message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, city, company, message, type } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email y mensaje son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Create contact message
    const contactMessage = await db.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        city: city || null,
        company: company || null,
        message,
        type: type || 'consulta',
      },
    });

    return NextResponse.json({
      success: true,
      data: contactMessage,
      message: 'Mensaje enviado exitosamente. Nos pondremos en contacto pronto.',
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { success: false, error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}
