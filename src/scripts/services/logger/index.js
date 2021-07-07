import Debug from 'debug';

export default function() {
  return Object.freeze({
    debug: Debug('app:debug'),
    info: Debug('app:info'),
    error: Debug('app:error')
  });
}