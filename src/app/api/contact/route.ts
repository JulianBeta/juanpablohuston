import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const RECIPIENTS = [
  "juanpablocam97@gmail.com",
  "carramplancha@gmail.com",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Todos los campos (Nombre, Email, Mensaje) son obligatorios" },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (smtpUser && smtpPass) {
      try {
        const isSecure = smtpPort === 465;

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure, // true for 465, false for 587
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const mailOptions = {
          from: `"Juan Pablo Huston Web" <${smtpUser}>`,
          to: RECIPIENTS.join(", "),
          replyTo: email,
          subject: `Nuevo mensaje de contacto: ${name}`,
          text: `
Nuevo mensaje recibido desde el sitio web de Juan Pablo Huston:

Nombre Completo: ${name}
Correo del Remitente: ${email}

Mensaje / Visión:
--------------------------------------------------
${message}
--------------------------------------------------
          `,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e4e4e7;">
                <h2 style="color: #141842; margin-top: 0;">Nuevo Mensaje de Contacto</h2>
                <p style="color: #414770; font-size: 14px;"><strong>Remitente:</strong> ${name}</p>
                <p style="color: #414770; font-size: 14px;"><strong>Correo:</strong> <a href="mailto:${email}" style="color: #BE8A60;">${email}</a></p>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
                <h4 style="color: #141842; margin-bottom: 8px;">Mensaje / Visión:</h4>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #141842; line-height: 1.6;">
                  ${message.replace(/\n/g, "<br/>")}
                </div>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
                <p style="font-size: 11px; color: #71717a; text-align: center;">
                  Enviado a ${RECIPIENTS.join(" y ")} desde el sitio web de Juan Pablo Huston.
                </p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({
          success: true,
          message: `Mensaje enviado a ${RECIPIENTS.join(" y ")}`,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[SMTP Connection Error]:", errorMsg);
        return NextResponse.json(
          { error: `Error de conexión SMTP (${errorMsg}). Verifique su contraseña de aplicación Google o puerto.` },
          { status: 500 }
        );
      }
    } else {
      console.log("==================================================");
      console.log("[FORMULARIO DE CONTACTO RECIBIDO EN SERVIDOR]");
      console.log(`Destinatarios: ${RECIPIENTS.join(", ")}`);
      console.log(`Nombre: ${name}`);
      console.log(`Email Remitente: ${email}`);
      console.log(`Mensaje: ${message}`);
      console.log("Nota: Configura SMTP_USER y SMTP_PASS en .env.local para entrega real.");
      console.log("==================================================");

      return NextResponse.json({
        success: true,
        message: `Mensaje registrado para ${RECIPIENTS.join(" y ")}`,
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error en API de contacto:", msg);
    return NextResponse.json(
      { error: "Error interno al procesar el formulario" },
      { status: 500 }
    );
  }
}
