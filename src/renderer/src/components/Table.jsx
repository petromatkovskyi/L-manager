import {
  Button,
  Sheet,
  Table,
  ButtonGroup,
  CircularProgress,
  Typography,
} from '@mui/joy';
import { useSelector, useDispatch } from 'react-redux';
import { changeDownloadStatus, fetchNewFrames } from '../store/newFramesSlice';

const rows = [];

export default function TableStripe({ isSaved, isDownloading, setIsDownloading }) {
  const { frames } = useSelector((state) => state.newFrames);

  const dispatch = useDispatch();

  const onFindFrames = () => dispatch(fetchNewFrames());

  const downloadFrames = async () => {
    if (!frames.length) return;

    setIsDownloading(true);

    frames.forEach((frame) => {
      dispatch(changeDownloadStatus({ num: frame.num, status: 'pending' }));
    });

    // make check for block name
    const foldersPaths = await electronApi.checkFolders(frames[0].block);

    if (foldersPaths.searchingPath && foldersPaths.destinationFolderPath) {
      for (const frame of frames) {
        dispatch(changeDownloadStatus({ num: frame.num, status: 'progress' }));

        const res = await electronApi.downloadFile({
          foldersPaths,
          fileName: frame.section,
        });
        dispatch(
          changeDownloadStatus({ num: frame.num, status: res ? 'done' : 'error' })
        );
      }
      // unarchive downloaded files in destination folder
      electronApi.unArchive(foldersPaths.destinationFolderPath);

      const dataForDB = {
        frames: frames,
        block: frames[0]?.block,
        framesLocation: foldersPaths.destinationFolderPath,
        takenFrom: foldersPaths.searchingPath,
      };

      const res = await electronApi.saveNewFramesInDB(dataForDB);

      console.log({ dataForDB });
      console.log({ res });
    }

    // make some ui changes
    setIsDownloading(false);
  };

  return (
    <Sheet>
      <ButtonGroup spacing={1} variant="outlined" sx={{ mb: 1 }}>
        <Button
          color="primary"
          onClick={onFindFrames}
          disabled={!isSaved || isDownloading}
        >
          Find new frames
        </Button>
        <Button
          color="success"
          onClick={!isDownloading ? downloadFrames : () => {}}
          variant={isDownloading ? 'solid' : ''}
          startDecorator={isDownloading ? <CircularProgress variant="solid" /> : ''}
        >
          {isDownloading ? 'Downloading' : 'Download new frames'}
        </Button>
      </ButtonGroup>
      {/* <Button
        onClick={async () => {
          const frames = await electronApi.findNewFrames();
          const dataForDownload = {
            block: frames[0].block,
            fileNames: frames.map((frame) => frame.section),
          };

          downloadFrames(dataForDownload);
        }}
      >
        get frames
      </Button> */}
      <Table
        aria-label="striped table"
        color="primary"
        variant="outlined"
        stripe="odd"
        borderAxis="xBetween"
      >
        <thead>
          <tr>
            <th>Row #</th>
            <th>Block</th>
            <th>Section</th>
            <th>Operator</th>
            <th>Done</th>
            <th>Check</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {frames.map((row) => (
            <tr key={row.num}>
              <td>{row.num}</td>
              <td>{row.block}</td>
              <td>{row.section}</td>
              <td>{row.operator}</td>
              <td>{row.done}</td>
              <td>{row.check}</td>
              <td>
                <Typography
                  color={
                    row.status === 'done'
                      ? 'success'
                      : row.status === 'progress'
                      ? 'primary'
                      : row.status === 'error'
                      ? 'dager'
                      : row.status === 'pending'
                      ? 'warning'
                      : 'neutral'
                  }
                  level="title-md"
                  variant="plain"
                  // textAlign="center"
                >
                  {row.status}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Sheet>
  );
}

async function downloadFrames(frames) {
  // frames.fileNames.forEach((fileName) => changeLabelStatus(fileName));

  if (frames.block && frames.fileNames.length) {
    const foldersPaths = await electronApi.checkFolders(frames);

    if (foldersPaths.searchingPath && foldersPaths.destinationFolderPath) {
      // for (const fileName of frames.fileNames) {
      //   changeLabelStatus(fileName, 'start');

      //   const res = await electronApi.downloadFile({
      //     foldersPaths,
      //     fileName,
      //   });
      //   changeLabelStatus(fileName, res ? 'success' : 'error');
      // }
      //unarchive downloaded files in destination folder
      // electronApi.unArchive(foldersPaths.destinationFolderPath);

      const dataForDB = {
        frames: frames.fileNames,
        block: frames.block,
        framesLocation: foldersPaths.destinationFolderPath,
      };

      const res = await electronApi.saveNewFramesInDB(dataForDB);

      console.log({ dataForDB });
      console.log({ res });
    }

    //make some ui changes
  }
}
