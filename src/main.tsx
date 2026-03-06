import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from '@arco-design/web-react'

import { App } from '@/app/App'
import '@/app/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider componentConfig={{ Card: { bordered: false } }}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
