import axios from 'axios';
import { logger } from '../utils/logger';

export interface Alert {
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    context?: Record<string, any>;
    timestamp?: Date;
}

export interface AlertChannel {
    type: 'slack' | 'email' | 'webhook' | 'log';
    enabled: boolean;
    config: Record<string, any>;
}

class AlertingService {
    private channels: AlertChannel[] = [];

    constructor() {
        this.initializeChannels();
    }

    private initializeChannels() {
        // Slack
        if (process.env.SLACK_WEBHOOK_URL) {
            this.channels.push({
                type: 'slack',
                enabled: true,
                config: {
                    webhookUrl: process.env.SLACK_WEBHOOK_URL,
                    channel: process.env.SLACK_CHANNEL || '#alerts',
                },
            });
        }

        // Email (if configured)
        if (process.env.SMTP_HOST) {
            this.channels.push({
                type: 'email',
                enabled: true,
                config: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    from: process.env.ALERT_EMAIL_FROM || 'alerts@flying411.com',
                    to: process.env.ALERT_EMAIL_TO?.split(',') || [],
                },
            });
        }

        // Custom webhook
        if (process.env.ALERT_WEBHOOK_URL) {
            this.channels.push({
                type: 'webhook',
                enabled: true,
                config: {
                    url: process.env.ALERT_WEBHOOK_URL,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Alert-Source': 'flying411-inventory',
                    },
                },
            });
        }

        // Always enable logging
        this.channels.push({
            type: 'log',
            enabled: true,
            config: {},
        });
    }

    /**
     * Send an alert through all configured channels
     */
    async sendAlert(alert: Alert): Promise<void> {
        const fullAlert: Alert = {
            ...alert,
            timestamp: alert.timestamp || new Date(),
        };

        const promises = this.channels
            .filter((channel) => channel.enabled)
            .map((channel) => this.sendToChannel(channel, fullAlert));

        await Promise.allSettled(promises);
    }

    private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
        try {
            switch (channel.type) {
                case 'slack':
                    await this.sendToSlack(channel.config, alert);
                    break;
                case 'email':
                    await this.sendToEmail(channel.config, alert);
                    break;
                case 'webhook':
                    await this.sendToWebhook(channel.config, alert);
                    break;
                case 'log':
                    this.sendToLog(alert);
                    break;
            }
        } catch (error: any) {
            logger.error(`Failed to send alert to ${channel.type}:`, error);
        }
    }

    private async sendToSlack(config: any, alert: Alert): Promise<void> {
        const color = this.getSeverityColor(alert.severity);
        const emoji = this.getSeverityEmoji(alert.severity);

        const payload = {
            channel: config.channel,
            username: 'Flying411 Alerts',
            icon_emoji: emoji,
            attachments: [
                {
                    color,
                    title: alert.title,
                    text: alert.message,
                    fields: alert.context
                        ? Object.entries(alert.context).map(([key, value]) => ({
                              title: key,
                              value: String(value),
                              short: true,
                          }))
                        : [],
                    footer: 'Flying411 Inventory System',
                    ts: Math.floor((alert.timestamp?.getTime() || Date.now()) / 1000),
                },
            ],
        };

        await axios.post(config.webhookUrl, payload);
        logger.info(`Alert sent to Slack: ${alert.title}`);
    }

    private async sendToEmail(config: any, alert: Alert): Promise<void> {
        // Email implementation would use nodemailer
        // This is a placeholder for the email sending logic
        logger.info(`Email alert: ${alert.title} (email sending not yet configured)`);
    }

    private async sendToWebhook(config: any, alert: Alert): Promise<void> {
        await axios.post(
            config.url,
            {
                severity: alert.severity,
                title: alert.title,
                message: alert.message,
                context: alert.context,
                timestamp: alert.timestamp,
                source: 'flying411-inventory',
            },
            { headers: config.headers }
        );
        logger.info(`Alert sent to webhook: ${alert.title}`);
    }

    private sendToLog(alert: Alert): void {
        const logLevel = this.getLogLevel(alert.severity);
        logger[logLevel](`[ALERT] ${alert.title}: ${alert.message}`, alert.context);
    }

    private getSeverityColor(severity: Alert['severity']): string {
        const colors = {
            info: '#36a64f',
            warning: '#ff9900',
            error: '#ff0000',
            critical: '#8b0000',
        };
        return colors[severity];
    }

    private getSeverityEmoji(severity: Alert['severity']): string {
        const emojis = {
            info: ':information_source:',
            warning: ':warning:',
            error: ':x:',
            critical: ':rotating_light:',
        };
        return emojis[severity];
    }

    private getLogLevel(severity: Alert['severity']): 'info' | 'warn' | 'error' {
        if (severity === 'info') return 'info';
        if (severity === 'warning') return 'warn';
        return 'error';
    }

    /**
     * Convenience methods for common alert types
     */
    async syncFailed(listingId: string, error: string): Promise<void> {
        await this.sendAlert({
            severity: 'error',
            title: 'Sync Failed',
            message: `Failed to sync listing to Flying411`,
            context: {
                listingId,
                error,
                action: 'Check sync logs and retry manually',
            },
        });
    }

    async syncHealthDegraded(metrics: any): Promise<void> {
        await this.sendAlert({
            severity: 'warning',
            title: 'Sync Health Degraded',
            message: `Sync system performance is below threshold`,
            context: {
                successRate: `${metrics.successRate}%`,
                failed: metrics.failed,
                pending: metrics.pending,
                action: 'Review failed syncs in admin dashboard',
            },
        });
    }

    async apiDown(service: string, error: string): Promise<void> {
        await this.sendAlert({
            severity: 'critical',
            title: `${service} API Down`,
            message: `Unable to reach ${service} API`,
            context: {
                service,
                error,
                action: 'Check API credentials and network connectivity',
            },
        });
    }

    async databaseError(error: string): Promise<void> {
        await this.sendAlert({
            severity: 'critical',
            title: 'Database Error',
            message: 'Critical database error detected',
            context: {
                error,
                action: 'Check database connection and health',
            },
        });
    }

    async deploymentSuccess(environment: string, version: string): Promise<void> {
        await this.sendAlert({
            severity: 'info',
            title: 'Deployment Successful',
            message: `Successfully deployed to ${environment}`,
            context: {
                environment,
                version,
            },
        });
    }
}

export const alertingService = new AlertingService();
