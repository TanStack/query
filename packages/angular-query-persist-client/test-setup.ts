import '@testing-library/jest-dom/vitest'
import { getTestBed } from '@angular/core/testing'
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing'

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
