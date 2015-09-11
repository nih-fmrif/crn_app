import Reflux from 'reflux';

var Actions = Reflux.createActions([
	'updateDescription',
	'updateDigitalDocuments',
	'updateREADME',
	'saveDescription',
	'loadDataset',
	'loadUsers',
	'publish',
	'deleteDataset',
	'setInitialState'
]);

export default Actions;