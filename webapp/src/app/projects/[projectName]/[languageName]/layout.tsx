import { Box } from '@mui/material';

import Header from '@/components/Header';
import Main from '@/components/Main';
import Sidebar from '@/components/Sidebar';

export default function Layout({
  // children,
  explorer,
  messages,
}: {
  // children: React.ReactNode;
  explorer: React.ReactNode;
  messages: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <Header />
      <Sidebar>{explorer}</Sidebar>
      <Main>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages}
        </Box>
      </Main>
    </Box>
  );
}
