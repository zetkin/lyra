import { Box } from '@mui/joy';
import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';
import Header from '@/components/Header';
import Main from '@/components/Main';
import { NextPage } from 'next';
import Sidebar from '@/components/Sidebar';

const TranslationPage: NextPage<{
  params: { languageName: string; messageId?: string[]; projectName: string };
}> = async ({ params }) => {
  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
        <Header />
        <Sidebar />
        <Main>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <h1>Messages</h1>
              {(params.messageId || []).join('/')}
            </Box>
          </Box>
        </Main>
      </Box>
    </CssVarsProvider>
  );
};

export default TranslationPage;
