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

import createPullRequest, {
  type PullRequestState,
} from '@/actions/createPullRequest';

type PullRequestButtonProps = {
  projectName: string;
};

const PullRequestButton: FC<PullRequestButtonProps> = ({ projectName }) => {
  const [state, setState] = useState<PullRequestState>({
    pullRequestStatus: 'idle',
  });

  const onClickSend = useCallback(async () => {
    setState((s) => ({ ...s, pullRequestStatus: 'sending' }));
    const response = await createPullRequest(projectName);
    setState(response);
  }, [projectName]);

  const onDismissSnackbar = useCallback(() => {
    setState((s) => ({ ...s, pullRequestStatus: 'idle' }));
  }, []);

  return (
    <>
      <Box
        style={{
          alignContent: 'center',
          display: 'flex',
          height: 40,
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
            Pull Request
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
