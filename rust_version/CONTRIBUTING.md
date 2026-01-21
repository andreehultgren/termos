# Contributing to Termos

Thank you for your interest in contributing to Termos! This document provides guidelines for contributing to the project.

## Development Setup

1. Install Rust (1.70+): https://rustup.rs/
2. Install Tauri prerequisites: https://tauri.app/v1/guides/getting-started/prerequisites
3. Clone the repository
4. Run `cargo run` to start the development build

## Project Structure

- `src/lib.rs` - Core business logic (button management, state)
- `src/main.rs` - Tauri application entry point (PTY, IPC)
- `dist/` - Frontend files (HTML, CSS, JavaScript)
- `tauri.conf.json` - Tauri configuration

## Making Changes

### Code Style

- Follow Rust standard formatting: `cargo fmt`
- Run linter before submitting: `cargo clippy`
- Run tests: `cargo test`

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep first line under 72 characters

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `cargo test`
5. Format code: `cargo fmt`
6. Commit your changes
7. Push to your fork
8. Open a Pull Request

## Adding Features

### Frontend Changes

- Edit files in `dist/` directory
- Follow existing code style
- Test in the running application

### Backend Changes

- Modify `src/main.rs` for PTY/Tauri commands
- Modify `src/lib.rs` for business logic
- Add tests for new functionality

## Bug Reports

When reporting bugs, please include:

- Operating system and version
- Rust version (`rustc --version`)
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## Feature Requests

Feature requests are welcome! Please:

- Check if the feature already exists
- Describe the use case
- Explain why it would be useful
- Consider submitting a PR if you can implement it

## Testing

Run the full test suite:

```bash
cargo test
```

Test the application:

```bash
cargo run
```

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## Questions?

Open an issue for questions or discussions about contributing.

Thank you for contributing! 🎉
