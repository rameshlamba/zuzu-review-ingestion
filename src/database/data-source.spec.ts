describe('DataSource Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have proper database configuration structure', () => {
    // Test that the data-source file exists and has the expected structure
    const fs = require('fs');
    const path = require('path');
    const dataSourcePath = path.join(__dirname, 'data-source.ts');
    
    expect(fs.existsSync(dataSourcePath)).toBe(true);
    
    const dataSourceContent = fs.readFileSync(dataSourcePath, 'utf8');
    
    // Check for essential DataSource configuration
    expect(dataSourceContent).toContain('DataSource');
    expect(dataSourceContent).toContain('type: \'postgres\'');
    expect(dataSourceContent).toContain('process.env.DB_HOST');
    expect(dataSourceContent).toContain('process.env.DB_PORT');
    expect(dataSourceContent).toContain('process.env.DB_USERNAME');
    expect(dataSourceContent).toContain('process.env.DB_PASSWORD');
    expect(dataSourceContent).toContain('process.env.DB_NAME');
  });

  it('should use environment variables for database configuration', () => {
    const fs = require('fs');
    const path = require('path');
    const dataSourcePath = path.join(__dirname, 'data-source.ts');
    const dataSourceContent = fs.readFileSync(dataSourcePath, 'utf8');
    
    // Check that environment variables are used with proper defaults
    expect(dataSourceContent).toContain('process.env.DB_HOST || \'localhost\'');
    expect(dataSourceContent).toContain('parseInt(process.env.DB_PORT) || 5432');
    expect(dataSourceContent).toContain('process.env.DB_USERNAME || \'postgres\'');
    expect(dataSourceContent).toContain('process.env.DB_PASSWORD || \'postgres\'');
    expect(dataSourceContent).toContain('process.env.DB_NAME || \'reviews\'');
  });

  it('should have proper TypeORM configuration', () => {
    const fs = require('fs');
    const path = require('path');
    const dataSourcePath = path.join(__dirname, 'data-source.ts');
    const dataSourceContent = fs.readFileSync(dataSourcePath, 'utf8');
    
    // Check for essential TypeORM settings
    expect(dataSourceContent).toContain('synchronize: false');
    expect(dataSourceContent).toContain('entities:');
    expect(dataSourceContent).toContain('migrations:');
    
    // Check for conditional logging
    expect(dataSourceContent).toContain('NODE_ENV');
  });

  it('should export the AppDataSource', () => {
    const fs = require('fs');
    const path = require('path');
    const dataSourcePath = path.join(__dirname, 'data-source.ts');
    const dataSourceContent = fs.readFileSync(dataSourcePath, 'utf8');
    
    // Check that AppDataSource is exported
    expect(dataSourceContent).toContain('export');
    expect(dataSourceContent).toContain('AppDataSource');
  });

  it('should have migration configuration', () => {
    const fs = require('fs');
    const path = require('path');
    const dataSourcePath = path.join(__dirname, 'data-source.ts');
    const dataSourceContent = fs.readFileSync(dataSourcePath, 'utf8');
    
    // Check for migration settings
    expect(dataSourceContent).toContain('migrations:');
    expect(dataSourceContent).toContain('migrationsTableName:');
  });
});