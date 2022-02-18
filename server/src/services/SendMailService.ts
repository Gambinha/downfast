import fs from 'fs';
import handlebars from 'handlebars';
import nodemailer, { Transporter } from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();

class SendMailService {
    private client: Transporter;

    constructor() {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "downfastapp@gmail.com",
                pass: "Downfast2021",
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

        const message = await this.client.sendMail({
            to,
            subject: "Alteração de Senha DownFast",
            html,
            from: "NPS <noreplay@nps.com.br>",
        });
    }
}

export default new SendMailService();