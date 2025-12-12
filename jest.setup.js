// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Web Crypto API for tests
const crypto = require('crypto').webcrypto
global.crypto = crypto
