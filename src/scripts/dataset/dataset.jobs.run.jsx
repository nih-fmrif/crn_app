// dependencies ------------------------------------------------------------------

import React      from 'react';
import actions    from './dataset.actions';
import WarnButton from '../common/forms/warn-button.jsx';
import moment     from 'moment';
import FileTree   from '../common/partials/file-tree.jsx';
import {Accordion, Panel} from 'react-bootstrap';

class JobAccordion extends React.Component {

// life cycle methods ------------------------------------------------------------

    render () {
        let run = this.props.run;

        if ((run.parameters && Object.keys(run.parameters).length > 0) || (run.results && run.results.length > 0) || (run.logs && run.logs.length > 0)) {
            // header with parameters and/or results
            return (
                <span eventKey={run._id}>
                    <Panel className={run.active ? 'job border-flash' : 'job'} header={this._header(run)}>
                        <span className="inner">
                            {this._parameters(run)}
                            {this._results(run, 'results')}
                            {this._results(run, 'logs')}
                        </span>
                    </Panel>
                </span>
            );
        } else {
            // header only
            return (
                <span eventKey={run._id}>
                    <div className="job panel panel-default">
                        <div className="panel-heading" >
                            <div className="panel-title pending">
                                {this._header(run)}
                            </div>
                        </div>
                    </div>
                </span>
            );
        }
    }

// template methods --------------------------------------------------------------

    _header (run) {
        let runBy = run.userId ? <span><br/><label>By </label><strong>{run.userId}</strong></span> : null;
        return (
            <div className={run.agave.status.toLowerCase()}>
                <label>Status</label>
                <span className="badge">
                    {this._status(run.agave.status)}
                </span><br/>
                <span className="meta">
                    <label>Run on </label><strong>{moment(run.agave.created).format('L')}</strong> at <strong>{moment(run.agave.created).format('LT')}</strong>
                    {runBy}
                </span><br/>
                <span className="meta">
                    <label>Job ID</label><strong>{run.jobId}</strong>
                </span>
                {this._failedMessage(run)}
            </div>
        );
    }

    _results(run, type) {
        if (run[type] && run[type].length > 0) {

            return (
                <Accordion accordion className="results">
                    <Panel className="fade-in" header={type} key={run._id} eventKey={run._id}>
                        <span className="download-all">
                            <WarnButton
                                icon="fa-download"
                                message=" DOWNLOAD All"
                                prepDownload={actions.getResultDownloadTicket.bind(this, run.snapshotId, run.jobId, {path:'all-' + type})} />
                        </span>
                        <div className="file-structure fade-in panel-group">
                            <div className="panel panel-default">
                                <div className="panel-collapse" aria-expanded="false" >
                                    <div className="panel-body">
                                        <FileTree
                                            tree={run[type]}
                                            treeId={run._id}
                                            editable={false}
                                            getFileDownloadTicket={actions.getResultDownloadTicket.bind(this, run.snapshotId, run.jobId)}
                                            displayFile={this.props.displayFile.bind(this, run.snapshotId, run.jobId)}
                                            toggleFolder={this.props.toggleFolder} />
                                   </div>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </Accordion>
            );
        }
    }

    _parameters(run) {
        if (run.parameters && Object.keys(run.parameters).length > 0) {
            let parameters = [];
            for (let key in run.parameters) {
                parameters.push(
                    <li key={key}>
                        <span>{key}</span>: <span>{run.parameters[key]}</span>
                    </li>
                );
            }

            return (
                <Accordion accordion className="results">
                    <Panel className="fade-in" header="Parameters" key={run._id} eventKey={run._id}>
                        <ul>{parameters}</ul>
                    </Panel>
                </Accordion>
            );
        }
    }

    _status(status) {
        if (status === 'FINISHED' || status === 'FAILED') {
            return status;
        } else {
            return (
                <div className="ellipsis-animation">
                    {status}
                    <span className="one">.</span>
                    <span className="two">.</span>
                    <span className="three">.</span>
                </div>
            );
        }
    }

    _failedMessage(run) {
        if (run.agave.status === 'FAILED') {
            let adminMessage = <span>Please contact the site <a href="mailto:nimhdsst@mail.nih.gov?subject=NIDO%20Analysis%20Failure" target="_blank" rel="noopener noreferrer">administrator</a> if this analysis continues to fail.</span>;
            let message = run.agave.message ? run.agave.message : 'We were unable to complete this analysis.';
            return (
                <div>
                    <h5 className="text-danger">{message} {adminMessage}</h5>
                    <WarnButton
                        icon="fa fa-repeat"
                        message="re-run"
                        warn={false}
                        action={actions.retryJob.bind(this, run.jobId)} />
                </div>
            );
        }
    }

}

JobAccordion.propTypes = {
    run: React.PropTypes.object,
    displayFile: React.PropTypes.func,
    toggleFolder: React.PropTypes.func
};

export default JobAccordion;
