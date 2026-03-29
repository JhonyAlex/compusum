import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { transferSessionCartToUser, transferSessionOrderToUser } from '@/lib/order-cart-upsert';

// POST /api/auth/login - Login admin user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Usuario desactivado' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id);
    await setSessionCookie(token);

    // Transferir carrito y pedidos de la sesión de invitado al usuario
    const sessionId = request.headers.get('x-session-id');
    if (sessionId) {
      await Promise.all([
        transferSessionCartToUser(sessionId, user.id),
        transferSessionOrderToUser(sessionId, user.id),
      ]).catch((e) => console.error('Error transfiriendo sesión al usuario:', e));
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    console.error('Error during login:', error);

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('database') ||
        message.includes('prisma') ||
        message.includes('relation') ||
        message.includes('table')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'La base de datos no está lista. Ejecuta migraciones y seed del admin.'
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
