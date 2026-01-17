# Security Policy

## Supported Versions

Currently supported versions of Faeweel:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Considerations

### File System Access

Faeweel requires access to your file system to monitor and transfer files. Please be aware:

- **Source Folders**: Faeweel will read all files in the selected source folder and its subdirectories
- **Destination Folders**: Faeweel will write files to the selected destination folder
- **Permissions**: Ensure you have appropriate read/write permissions for selected folders
- **Sensitive Data**: Do not transfer sensitive data without proper encryption at rest

### Best Practices

1. **Folder Selection**
   - Only select folders you own and trust
   - Avoid system directories (e.g., `/System`, `C:\Windows`)
   - Be cautious with cloud-synced folders

2. **Network Locations**
   - Verify network path authenticity before use
   - Use secure network connections when transferring over network drives
   - Consider VPN for remote transfers

3. **Data Security**
   - Files are copied without encryption by default
   - For sensitive data, use encrypted volumes or folders
   - Consider the security of your destination location

4. **Application Security**
   - Keep Faeweel updated to the latest version
   - Download only from official sources
   - Verify installer integrity if possible

### What Faeweel Does NOT Do

- Does **NOT** send your data over the internet
- Does **NOT** collect telemetry or usage data
- Does **NOT** require internet connection to function
- Does **NOT** access files outside selected folders
- Does **NOT** modify source files (read-only access)
- Does **NOT** execute or run transferred files

### Security Features

- **Local Operation**: All transfers happen locally on your machine
- **No Remote Code**: No remote code execution
- **Sandboxed Dialogs**: Uses Electron's safe dialog APIs for folder selection
- **Read-Only Source**: Source files are never modified
- **Validated Paths**: All file paths are validated before operations
- **Error Isolation**: File-level errors don't affect other transfers

## Reporting a Vulnerability

If you discover a security vulnerability in Faeweel, please help us protect users by reporting it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. **Email** security reports to: [Your security contact email here]
3. **Include** the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Your name/handle for credit (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Status Updates**: Regular updates on progress
- **Fix Timeline**: Depends on severity
  - **Critical**: Patch within 7 days
  - **High**: Patch within 30 days
  - **Medium**: Patch within 90 days
  - **Low**: Next scheduled release

### Disclosure Policy

- We follow **coordinated disclosure**
- Security patches released before public disclosure
- Credit given to reporter (unless anonymity requested)
- Public disclosure after patch is available

### Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1)
- Documented in CHANGELOG.md
- Announced in release notes
- Tagged with [SECURITY] in commit messages

## Known Security Limitations

### Electron Security

- **Node Integration**: Enabled for file system access (required)
- **Context Isolation**: Disabled (required for Node.js integration)
- **Remote Module**: Enabled for desktop integration

These settings are necessary for Faeweel's functionality but reduce Electron's security sandbox. This is acceptable because:
- No remote content is loaded
- No untrusted code is executed
- Only local, user-selected files are accessed

### File System Risks

- **Symlink Following**: Faeweel follows symbolic links
- **Large Files**: No size limit enforcement (system dependent)
- **Disk Space**: No automatic disk space checking before transfer
- **File Locks**: May fail to transfer locked files

### Mitigation

Users should:
- Ensure adequate disk space
- Avoid transferring system-critical files
- Monitor transfers of very large files
- Be cautious with symlinks

## Security Checklist for Users

- [ ] Downloaded from official source
- [ ] Verified application signature (if available)
- [ ] Using latest version
- [ ] Selected trusted source/destination folders
- [ ] Reviewed folder permissions
- [ ] Not transferring sensitive unencrypted data
- [ ] Destination location is secure
- [ ] Application not running with elevated privileges (unless necessary)

## Third-Party Dependencies

Faeweel uses the following dependencies with security implications:

- **Electron**: Desktop application framework
  - Keep updated to latest stable version
  - Monitor Electron security advisories

- **Chokidar**: File system watcher
  - Well-maintained, widely used
  - Regular security updates

- **ws**: WebSocket library
  - Currently unused but included for future features
  - Will be used with proper authentication when implemented

Dependencies are regularly audited using `npm audit`.

### Running Security Audit

```bash
# Check for known vulnerabilities
npm audit

# Attempt automatic fixes
npm audit fix

# View detailed report
npm audit --json
```

## Data Privacy

### What Data is Stored

- **Configuration**: Source/destination folder paths (local storage only)
- **Statistics**: Transfer statistics (in-memory only, not persisted)
- **Logs**: Activity log (in-memory only, not persisted)
- **No Personal Data**: No personal information collected or stored

### What Data is Transmitted

- **None**: All operations are local
- **No Network Calls**: Application doesn't make network requests (except npm package downloads during install)
- **No Analytics**: No usage tracking or analytics

## Compliance

Faeweel is designed for:
- Personal use
- Internal corporate use
- Development workflows

For regulated industries (healthcare, finance, etc.):
- Ensure compliance with your organization's data policies
- Consider encryption requirements
- Review audit trail needs (not currently built-in)
- Assess need for access controls (file system level)

## Contact

For security concerns:
- Email: [Security contact]
- GitHub: [Project repository] (non-security issues only)

---

**Last Updated**: 2026-01-17
**Version**: 1.0.0
