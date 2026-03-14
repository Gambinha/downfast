import fs from 'fs';
import handlebars from 'handlebars';
import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class SendMailService {
    private client: Transporter;

    constructor() {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || "smtp.gmail.com",
            port: Number(process.env.MAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            }
        });

        this.client = transporter;
    }

    async execute(to: string, variables: object, path: string) {
        const templateFileContent = fs.readFileSync(path).toString("utf-8");
        const mailTemplateParse = handlebars.compile(templateFileContent);
        const html = mailTemplateParse(variables);

        await this.client.sendMail({
            to,
            subject: "Alteração de Senha DownFast",
            html,
            from: process.env.MAIL_FROM || "noreply@downfast.app",
        });
    }
}

export default new SendMailService();
