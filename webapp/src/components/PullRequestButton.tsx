'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Snackbar,
} from '@mui/material';
import { FC, useCallback, useState } from 'react';

import { type PullRequestState } from '@/app/api/projects/[projectName]/pull-requests/route';

type PullRequestButtonProps = {
  projectName: string;
};

const PullRequestButton: FC<PullRequestButtonProps> = ({ projectName }) => {
  const [state, setState] = useState<PullRequestState>({
    pullRequestStatus: 'idle',
  });

  const onClickSend = useCallback(async () => {
    setState({ pullRequestStatus: 'sending' });
    const url = `/api/projects/${projectName}/pull-requests`;
    const response = await fetch(url, { method: 'POST' });
    const json = await response.json();
    setState(json);
  }, [projectName]);

  const onDismissSnackbar = useCallback(() => {
    setState({ pullRequestStatus: 'idle' });
  }, []);

  return (
    <>
      <Box
        p={2}
        style={{
          alignContent: 'center',
          borderTop: '1px solid #c3c7cc',
          display: 'flex',
          height: 64,
          justifyContent: 'center',
        }}
      >
        {(state.pullRequestStatus === 'idle' ||
          state.pullRequestStatus === 'error' ||
          state.pullRequestStatus === 'success') && (
          <Button
            fullWidth
            onClick={onClickSend}
            type="submit"
            variant="contained"
          >
            Publish changes
          </Button>
        )}
        {state.pullRequestStatus === 'sending' && (
          <Button disabled fullWidth variant="contained">
            <CircularProgress size={32} />
          </Button>
        )}
        {state.pullRequestStatus === 'success' && (
          <Snackbar open>
            <Alert
              onClose={onDismissSnackbar}
              severity="success"
              sx={{ width: '100%' }}
              variant="filled"
            >
              <Link href={state.pullRequestUrl} sx={{ color: 'white' }}>
                Pull request created
              </Link>
            </Alert>
          </Snackbar>
        )}
        {state.pullRequestStatus === 'error' && (
          <Snackbar open>
            <Alert
              onClose={onDismissSnackbar}
              severity="error"
              sx={{ width: '100%' }}
              variant="filled"
            >
              {state.errorMessage}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </>
  );
};

export default PullRequestButton;
