const db = require('../db');

const up = async () => {
    try {
        await db.query(`
            DROP TABLE IF EXISTS media_usage CASCADE;
            DROP TABLE IF EXISTS media_library CASCADE;
            DROP TABLE IF EXISTS media_folders CASCADE;

            CREATE TABLE media_folders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_id VARCHAR(50) NOT NULL,
                folder_name VARCHAR(100) NOT NULL,
                parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE media_library (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_id VARCHAR(50) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                file_url TEXT NOT NULL,
                thumbnail_url TEXT,
                folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
                tags JSONB DEFAULT '[]',
                size BIGINT DEFAULT 0,
                width INT,
                height INT,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE media_usage (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                media_id UUID REFERENCES media_library(id) ON DELETE CASCADE,
                module_name VARCHAR(50) NOT NULL,
                reference_id VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(media_id, module_name, reference_id)
            );
        `);
        console.log('Media tables created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error creating media tables:', err);
        process.exit(1);
    }
};

up();
