# Contributing to Faeweel

Thank you for your interest in contributing to Faeweel! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher
- Git
- Basic knowledge of Electron and Node.js

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Faeweel.git
   cd Faeweel
   ```

2. **Install dependencies**
   ```bash
   npm install
   # Or use the setup script
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   # Or use the dev script
   chmod +x scripts/dev.sh
   ./scripts/dev.sh
   ```

## Project Structure

```
Faeweel/
├── src/                    # Source code
│   ├── main.js            # Main Electron process
│   ├── fileTransfer.js    # File transfer logic
│   ├── hdmiDisplay.js     # Display management
│   ├── renderer.js        # Main window renderer
│   ├── hdmiRenderer.js    # HDMI display renderer
│   ├── index.html         # Main window UI
│   ├── hdmiDisplay.html   # HDMI display UI
│   └── styles.css         # Stylesheets
├── config/                # Configuration files
├── scripts/               # Utility scripts
├── examples/              # Example files and demos
└── tests/                 # Test files (future)
```

## Development Guidelines

### Code Style

- Use **2 spaces** for indentation
- Use **semicolons**
- Use **single quotes** for strings
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Add **JSDoc comments** for functions

Example:
```javascript
/**
 * Transfers a file from source to destination
 * @param {string} sourcePath - Path to source file
 * @param {string} destPath - Path to destination
 * @returns {Promise<boolean>} Success status
 */
async function transferFile(sourcePath, destPath) {
  // Implementation
}
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add network transfer support
fix: resolve queue processing deadlock
docs: update README with new features
```

### Testing

Before submitting a pull request:

1. **Test the application manually**
   - Create test files using `scripts/create-test-files.sh`
   - Test basic file transfer
   - Test HDMI display output
   - Test error handling

2. **Check for errors**
   - Open DevTools (npm run dev)
   - Check console for errors
   - Verify no memory leaks

3. **Validate code syntax**
   ```bash
   node -c src/*.js
   ```

## Making Contributions

### Reporting Bugs

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to reproduce**: Exact steps to reproduce the issue
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: OS, Node version, Electron version
6. **Screenshots**: If applicable
7. **Logs**: Any error messages or logs

### Suggesting Features

When suggesting features:

1. **Use case**: Describe why this feature is needed
2. **Proposed solution**: How you think it should work
3. **Alternatives**: Other approaches you've considered
4. **Additional context**: Any other relevant information

### Submitting Pull Requests

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow the code style guidelines
   - Add comments where necessary
   - Test thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Link any related issues

### Pull Request Guidelines

- **One feature per PR**: Keep PRs focused on a single feature or fix
- **Write descriptive titles**: Clearly describe what the PR does
- **Update documentation**: Update README or other docs if needed
- **Add tests**: If applicable (when test framework is added)
- **Keep commits clean**: Squash unnecessary commits
- **Respond to feedback**: Address review comments promptly

## Areas for Contribution

Here are some areas where contributions are welcome:

### High Priority
- [ ] Network transfer support (FTP, SFTP, SMB)
- [ ] File filtering (by type, size, pattern)
- [ ] Unit and integration tests
- [ ] Performance optimizations
- [ ] Better error handling and recovery

### Medium Priority
- [ ] Scheduled transfers
- [ ] Email notifications
- [ ] Cloud storage integration (S3, Dropbox, etc.)
- [ ] Transfer history and reporting
- [ ] Configuration UI

### Low Priority
- [ ] Compression options
- [ ] Bandwidth throttling
- [ ] Multiple source/destination pairs
- [ ] Themes and customization
- [ ] Internationalization (i18n)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Trolling or insulting comments
- Publishing others' private information

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Read the documentation
3. Open a new issue with the "question" label

## License

By contributing to Faeweel, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Faeweel! 🎉
