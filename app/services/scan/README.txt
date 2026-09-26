scan-job.server.js
    ↓
database operations

scan-worker.server.js
    ↓
ambil job

scan-processor.server.js
    ↓
jalankan actual scan

scan-runner.server.js
    ↓
entry point yang bisa dipakai
local + production

                  Browser
                     │
                     │ Scan Now
                     ▼
              Remix Action
                     │
                     ▼
              createScanJob()
                     │
                     ▼
              ┌────────────┐
              │  SQLite    │
              │  ScanJob   │
              └─────┬──────┘
                    │
                    │ PENDING
                    │
                    ▼
             npm run scan:worker
                    │
                    ▼
             processNextScanJob()
                    │
                    ▼
             processScanJob()
                    │
                    ▼
              Shopify API
                    │
                    ▼
                  Scan