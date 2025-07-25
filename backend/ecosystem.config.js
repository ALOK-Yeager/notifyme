module.exports = {
    apps: [{
        name: 'notification-backend',
        script: './index.js',
        instances: 'max',
        exec_mode: 'cluster',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_file: './logs/pm2-combined.log',
        time: true,
        merge_logs: true,
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }]
};
