import 'zone.js'
import 'zone.js/testing'
import '@testing-library/jest-dom/vitest'
import '@angular/compiler'
import { getTestBed } from '@angular/core/testing'
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing'

process.env.ANGULAR_QUERY_ZONEFUL = 'true'

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
