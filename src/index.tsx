import * as React from 'react';
import { Component } from 'react';
import { omit } from '@tolkam/lib-utils';
import { classNames } from '@tolkam/lib-utils-ui';
import InView, { IOffset, IVisibility, TStopFn } from '@tolkam/react-in-view';

const STATUS_MOUNT = 'mount';
const STATUS_BUSY = 'busy';
const STATUS_LOAD = 'load';
const STATUS_ERROR = 'error';

class LazyVideo extends Component<IProps, IState> {

    /**
     * Loading statuses
     * @var {number}
     */
    public static STATUS_MOUNT = STATUS_MOUNT;
    public static STATUS_BUSY = STATUS_BUSY;
    public static STATUS_LOAD = STATUS_LOAD;
    public static STATUS_ERROR = STATUS_ERROR;

    /**
     * @type IState
     */
    public state = {
        status: STATUS_MOUNT,
    };

    /**
     * @inheritDoc
     */
    public componentDidMount(): void {
        const that = this;
        !that.props.lazy && that.update(STATUS_BUSY);
    }

    /**
     * @inheritDoc
     */
    public render() {
        const that = this;
        const { props, state, onElementChanges } = that;
        const { status } = state;
        const { className } = props;
        let statusClassName;

        if (props.withStatusClasses && props.lazy) {
            statusClassName = (props.statusClassPrefix || (className ? className + '--' : '')) + 'status-' + status;
        }

        const videoProps = omit(props, [
            'sources',
            'lazy',
            'lazyParent',
            'lazyOffset',
            'withStatusClasses',
            'statusClassPrefix',
            'className',
            'omitProps'
        ]);

        const el = <div className={classNames(className, statusClassName)}>
            <video
                {...videoProps as any}
                onLoadStart={onElementChanges}
                onError={onElementChanges}>
                {status !== STATUS_MOUNT ? that.getSources(props.sources) : null}
            </video>
        </div>;

        return props.lazy ? <InView
            parent={props.lazyParent}
            offset={props.lazyOffset}
            onChanges={that.onLazyChanges}
            noClasses>{el}</InView> : el;
    }

    /**
     * Tracks element visibility changes
     *
     * @param v
     * @param stop
     */
    protected onLazyChanges = (v: IVisibility, stop: TStopFn) => {
        if(v.visible) {
            stop();
            this.update(STATUS_BUSY);
        }
    };

    /**
     * Tracks element state changes
     *
     * @param e
     */
    protected onElementChanges = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        this.update(e.type === 'loadstart' ? STATUS_LOAD : STATUS_ERROR);
    };

    /**
     * Updates component status
     *
     * @param status
     */
    protected update(status: string) {
        const onChanges = this.props.onChanges;

        this.setState({status}, () => {
            onChanges && onChanges(status);
        });
    }

    /**
     * Gets source elements
     *
     * @param sources
     */
    protected getSources(sources?: ISource[]) {
        return sources
            ? sources.map((source: any, i) =>  <source key={source.src || i} {...source} />)
            : [];
    }
}

interface IState {
    status: string,
}

export type ISource = keyof React.HTMLAttributes<HTMLSourceElement>;

export interface IProps extends React.HTMLAttributes<HTMLVideoElement> {
    // element children config
    sources?: ISource[],

    // lazy load
    lazy?: boolean,

    // parent to track visibility from
    lazyParent?: HTMLElement;

    // offset before image element becomes visible
    lazyOffset?: IOffset;

    // enable status classes
    withStatusClasses?: boolean;

    // status class prefix
    statusClassPrefix?: string;

    // callback on status changes
    onChanges?: (status: string) => void;
}

export default LazyVideo;
