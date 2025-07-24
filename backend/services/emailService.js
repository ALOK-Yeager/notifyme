const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        this.templates = new Map();
        this.loadTemplates();
    }

    async loadTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/email');
            try {
                await fs.mkdir(templatesDir, { recursive: true });
            } catch (err) {
                // Ignore if directory already exists
            }
            try {
                const files = await fs.readdir(templatesDir);
                for (const file of files) {
                    if (file.endsWith('.hbs')) {
                        const templateName = file.replace('.hbs', '');
                        const templatePath = path.join(templatesDir, file);
                        const templateContent = await fs.readFile(templatePath, 'utf-8');
                        this.templates.set(templateName, handlebars.compile(templateContent));
                    }
                }
                logger.info(`Loaded ${this.templates.size} email templates`);
            } catch (err) {
                logger.warn('No email templates found, using default template');
                this.templates.set('default', handlebars.compile(`
                    <h1>{{title}}</h1>
                    <p>{{message}}</p>
                `));
            }
        } catch (error) {
            logger.error('Error loading email templates:', error);
        }
    }

    // ...rest of the class remains the same...
}

module.exports = EmailService;
