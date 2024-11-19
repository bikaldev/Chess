import ChessBoard from '../Board/Board';
import { Box } from '@mui/material';

export default function DefaultPage() {
    return (
        <Box display="flex" width="100%" alignItems="center" justifyContent="center">
          <ChessBoard enable={false} side = "white"/>
      </Box>
    );
}
