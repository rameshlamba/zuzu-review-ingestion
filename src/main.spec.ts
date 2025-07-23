describe('Main Bootstrap', () => {
  // Since main.ts has side effects and auto-executes, we'll test its structure and logic
  
  it('should have proper bootstrap function structure', () => {
    const fs = require('fs');
    const path = require('path');
    const mainPath = path.join(__dirname, 'main.ts');
    
    expect(fs.existsSync(mainPath)).toBe(true);
    
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Check for essential bootstrap components
    expect(mainContent).toContain('NestFactory.create');
    expect(mainContent).toContain('AppModule');
    expect(mainContent).toContain('ValidationPipe');
    expect(mainContent).toContain('app.listen');
  });

  it('should configure validation pipe with correct options', () => {
    const fs = require('fs');
    const path = require('path');
    const mainPath = path.join(__dirname, 'main.ts');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Check validation pipe configuration
    expect(mainContent).toContain('transform: true');
    expect(mainContent).toContain('whitelist: true');
    expect(mainContent).toContain('forbidNonWhitelisted: true');
  });

  it('should handle port configuration', () => {
    const fs = require('fs');
    const path = require('path');
    const mainPath = path.join(__dirname, 'main.ts');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Check port handling
    expect(mainContent).toContain('process.env.PORT');
    expect(mainContent).toContain('3000'); // default port
  });

  it('should have error handling', () => {
    const fs = require('fs');
    const path = require('path');
    const mainPath = path.join(__dirname, 'main.ts');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Check error handling
    expect(mainContent).toContain('catch');
    expect(mainContent).toContain('process.exit(1)');
    expect(mainContent).toContain('Logger.error');
  });

  it('should have logging', () => {
    const fs = require('fs');
    const path = require('path');
    const mainPath = path.join(__dirname, 'main.ts');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Check logging
    expect(mainContent).toContain('Logger.log');
    expect(mainContent).toContain('running on port');
  });
});