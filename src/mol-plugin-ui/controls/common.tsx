/**
 * Copyright (c) 2018-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import * as React from 'react';
import { Color } from '../../mol-util/color';
import { IconName, Icon } from './icons';

export class ControlGroup extends React.Component<{
    header: string,
    initialExpanded?: boolean,
    hideExpander?: boolean,
    hideOffset?: boolean,
    topRightIcon?: IconName,
    headerLeftMargin?: string,
    onHeaderClick?: () => void,
    noTopMargin?: boolean
}, { isExpanded: boolean }> {
    state = { isExpanded: !!this.props.initialExpanded }

    headerClicked = () => {
        if (this.props.onHeaderClick) {
            this.props.onHeaderClick();
        } else {
            this.setState({ isExpanded: !this.state.isExpanded });
        }
    }

    render() {
        // TODO: customize header style (bg color, togle button etc)
        return <div className='msp-control-group-wrapper' style={{ position: 'relative', marginTop: this.props.noTopMargin ? 0 : void 0 }}>
            <div className='msp-control-group-header' style={{ marginLeft: this.props.headerLeftMargin }}>
                <Button onClick={this.headerClicked}>
                    {!this.props.hideExpander && <Icon name={this.state.isExpanded ? 'collapse' : 'expand'} />}
                    {this.props.topRightIcon && <Icon name={this.props.topRightIcon} style={{ position: 'absolute', right: '2px', top: 0 }} />}
                    <b>{this.props.header}</b>
                </Button>
            </div>
            {this.state.isExpanded && <div className={this.props.hideOffset ? '' : 'msp-control-offset'} style={{ display: this.state.isExpanded ? 'block' : 'none' }}>
                {this.props.children}
            </div>}
        </div>
    }
}

export interface TextInputProps<T> {
    className?: string,
    style?: React.CSSProperties,
    value: T,
    fromValue?(v: T): string,
    toValue?(s: string): T,
    // TODO: add error/help messages here?
    isValid?(s: string): boolean,
    onChange(value: T): void,
    onEnter?(): void,
    onBlur?(): void,
    delayMs?: number,
    blurOnEnter?: boolean,
    blurOnEscape?: boolean,
    isDisabled?: boolean,
    placeholder?: string
}

interface TextInputState {
    originalValue: string,
    value: string
}

function _id(x: any) { return x; }

export class TextInput<T = string> extends React.PureComponent<TextInputProps<T>, TextInputState> {
    private input = React.createRef<HTMLInputElement>();
    private delayHandle: any = void 0;
    private pendingValue: T | undefined = void 0;

    state = { originalValue: '', value: '' }

    onBlur = () => {
        this.setState({ value: '' + this.state.originalValue });
        if (this.props.onBlur) this.props.onBlur();
    }

    get isPending() { return typeof this.delayHandle !== 'undefined'; }

    clearTimeout() {
        if (this.isPending) {
            clearTimeout(this.delayHandle);
            this.delayHandle = void 0;
        }
    }

    raiseOnChange = () => {
        this.props.onChange(this.pendingValue!);
        this.pendingValue = void 0;
    }

    triggerChanged(formatted: string, converted: T) {
        this.clearTimeout();

        if (formatted === this.state.originalValue) return;

        if (this.props.delayMs) {
            this.pendingValue = converted;
            this.delayHandle = setTimeout(this.raiseOnChange, this.props.delayMs);
        } else {
            this.props.onChange(converted);
        }
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (this.props.isValid && !this.props.isValid(value)) {
            this.clearTimeout();
            this.setState({ value });
            return;
        }

        const converted = (this.props.toValue || _id)(value);
        const formatted = (this.props.fromValue || _id)(converted);
        this.setState({ value: formatted }, () => this.triggerChanged(formatted, converted));
    }

    onKeyUp  = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.charCode === 27 || e.keyCode === 27 /* esc */) {
            if (this.props.blurOnEscape && this.input.current) {
                this.input.current.blur();
            }
        }
    }

    onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13 || e.charCode === 13 /* enter */) {
            if (this.isPending) {
                this.clearTimeout();
                this.raiseOnChange();
            }
            if (this.props.blurOnEnter && this.input.current) {
                this.input.current.blur();
            }
            if (this.props.onEnter) this.props.onEnter();
        }
        e.stopPropagation();
    }

    static getDerivedStateFromProps(props: TextInputProps<any>, state: TextInputState) {
        const value = props.fromValue ? props.fromValue(props.value) : props.value;
        if (value === state.originalValue) return null;
        return { originalValue: value, value };
    }

    render() {
        return <input type='text'
            className={this.props.className}
            style={this.props.style}
            ref={this.input}
            onBlur={this.onBlur}
            value={this.state.value}
            placeholder={this.props.placeholder}
            onChange={this.onChange}
            onKeyPress={this.props.onEnter || this.props.blurOnEnter || this.props.blurOnEscape ? this.onKeyPress : void 0}
            onKeyDown={this.props.blurOnEscape ? this.onKeyUp : void 0}
            disabled={!!this.props.isDisabled}
        />;
    }
}

// TODO: replace this with parametrized TextInput
export class NumericInput extends React.PureComponent<{
    value: number,
    onChange: (v: number) => void,
    onEnter?: () => void,
    onBlur?: () => void,
    blurOnEnter?: boolean,
    isDisabled?: boolean,
    placeholder?: string
}, { value: string }> {
    state = { value: '0' };
    input = React.createRef<HTMLInputElement>();

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = +e.target.value;
        this.setState({ value: e.target.value }, () => {
            if (!Number.isNaN(value) && value !== this.props.value) {
                this.props.onChange(value);
            }
        });
    }

    onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.keyCode === 13 || e.charCode === 13)) {
            if (this.props.blurOnEnter && this.input.current) {
                this.input.current.blur();
            }
            if (this.props.onEnter) this.props.onEnter();
        }
        e.stopPropagation();
    }

    onBlur = () => {
        this.setState({ value: '' + this.props.value });
        if (this.props.onBlur) this.props.onBlur();
    }

    static getDerivedStateFromProps(props: { value: number }, state: { value: string }) {
        const value = +state.value;
        if (Number.isNaN(value) || value === props.value) return null;
        return { value: '' + props.value };
    }

    render() {
        return <input type='text'
            ref={this.input}
            onBlur={this.onBlur}
            value={this.state.value}
            placeholder={this.props.placeholder}
            onChange={this.onChange}
            onKeyPress={this.props.onEnter || this.props.blurOnEnter ? this.onKeyPress : void 0}
            disabled={!!this.props.isDisabled}
        />
    }
}

export class ExpandableControlRow extends React.Component<{
    label: string,
    colorStripe?: Color,
    pivot: JSX.Element,
    controls: JSX.Element
}, { isExpanded: boolean }> {
    state = { isExpanded: false };

    toggleExpanded = () => this.setState({ isExpanded: !this.state.isExpanded });

    render() {
        const { label, pivot, controls } = this.props;
        // TODO: fix the inline CSS
        return <>
            <div className='msp-control-row'>
                <span>
                    {label}
                    <button className='msp-btn-link msp-btn-icon msp-control-group-expander' onClick={this.toggleExpanded} title={`${this.state.isExpanded ? 'Less' : 'More'} options`}
                        style={{ background: 'transparent', textAlign: 'left', padding: '0' }}>
                        <Icon name={this.state.isExpanded ? 'minus' : 'plus'} style={{ display: 'inline-block' }} />
                    </button>
                </span>
                <div>{pivot}</div>
                {this.props.colorStripe && <div className='msp-expandable-group-color-stripe' style={{ backgroundColor: Color.toStyle(this.props.colorStripe) }} /> }
            </div>
            {this.state.isExpanded && <div className='msp-control-offset'>
                {controls}
            </div>}
        </>;
    }
}

export function SectionHeader(props: { icon?: IconName, title: string | JSX.Element, desc?: string}) {
    return <div className='msp-section-header'>
        {props.icon && <Icon name={props.icon} />}
        {props.title} <small>{props.desc}</small>
    </div>
}

export type ButtonProps = {
    style?: React.CSSProperties,
    className?: string,
    disabled?: boolean,
    title?: string,
    icon?: IconName,
    children?: React.ReactNode,
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
    onContextMenu?: (e: React.MouseEvent<HTMLButtonElement>) => void,
    onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void,
    onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void,
    inline?: boolean,
    'data-id'?: string,
    flex?: boolean | string | number,
    noOverflow?: boolean
}

export function Button(props: ButtonProps) {
    let className = 'msp-btn';
    if (!props.inline) className += ' msp-btn-block';
    if (props.noOverflow) className += ' msp-no-overflow';
    if (props.flex) className += ' msp-flex-item';
    if (props.className) className += ' ' + props.className;

    let style: React.CSSProperties | undefined = void 0;
    if (props.flex) {
        if (typeof props.flex === 'number') style = { flex: `0 0 ${props.flex}px`, padding: 0, maxWidth: `${props.flex}px` };
        else if (typeof props.flex === 'string') style = { flex: `0 0 ${props.flex}`, padding: 0, maxWidth: props.flex };
    }
    if (props.style) {
        if (style) Object.assign(style, props.style);
        else style = props.style;
    }

    return <button onClick={props.onClick} title={props.title} disabled={props.disabled} style={style} className={className} data-id={props['data-id']}
        onContextMenu={props.onContextMenu} onMouseEnter={props.onMouseEnter} onMouseLeave={props.onMouseLeave}>
        {props.icon && <Icon name={props.icon} />}
        {props.children}
    </button>;
}

export function IconButton(props: {
    icon: IconName,
    small?: boolean,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void,
    title?: string,
    toggleState?: boolean,
    disabled?: boolean,
    className?: string,
    style?: React.CSSProperties,
    'data-id'?: string,
    extraContent?: JSX.Element,
    flex?: boolean | string | number
}) {
    let className = `msp-btn-link msp-btn-icon${props.small ? '-small' : ''}${props.className ? ' ' + props.className : ''}`;
    if (typeof props.toggleState !== 'undefined') {
        className += ` msp-btn-link-toggle-${props.toggleState ? 'on' : 'off'}`
    }
    const iconStyle = props.small ? { fontSize: '80%' } : void 0;

    let style: React.CSSProperties | undefined = void 0;
    if (props.flex) {
        if (typeof props.flex === 'boolean') style = { flex: '0 0 32px', padding: 0 };
        else if (typeof props.flex === 'number') style = { flex: `0 0 ${props.flex}px`, padding: 0, maxWidth: `${props.flex}px` };
        else style = { flex: `0 0 ${props.flex}`, padding: 0, maxWidth: props.flex };
    }
    if (props.style) {
        if (style) Object.assign(style, props.style);
        else style = props.style;
    }

    return <button className={className} onClick={props.onClick} title={props.title} disabled={props.disabled} data-id={props['data-id']} style={style}>
        <Icon name={props.icon} style={iconStyle} />
        {props.extraContent}
    </button>;
}

export type ToggleButtonProps = {
    style?: React.CSSProperties,
    className?: string,
    disabled?: boolean,
    label?: string | JSX.Element,
    title?: string,
    icon?: IconName,
    isSelected?: boolean,
    toggle: () => void
}

export class ToggleButton extends React.PureComponent<ToggleButtonProps> {
    onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
        this.props.toggle();
    }

    render() {
        const props = this.props;
        const label = props.label;
        const className = props.isSelected ? `${props.className || ''} msp-control-current` : props.className;
        return <button onClick={this.onClick} title={this.props.title}
            disabled={props.disabled} style={props.style} className={className}>
            <Icon name={this.props.icon} />
            {label && this.props.isSelected ? <b>{label}</b> : label}
        </button>;
    }
}

export class ExpandGroup extends React.PureComponent<{ header: string, headerStyle?: React.CSSProperties, initiallyExpanded?: boolean, noOffset?: boolean, marginTop?: 0 | string, headerLeftMargin?: string }, { isExpanded: boolean }> {
    state = { isExpanded: !!this.props.initiallyExpanded };

    toggleExpanded = () => this.setState({ isExpanded: !this.state.isExpanded });

    render() {
        return <>
            <div className='msp-control-group-header' style={{ marginTop: this.props.marginTop !== void 0 ? this.props.marginTop : '1px', marginLeft: this.props.headerLeftMargin }}>
                <button className='msp-btn msp-form-control msp-btn-block' onClick={this.toggleExpanded} style={this.props.headerStyle}>
                    <Icon name={this.state.isExpanded ? 'collapse' : 'expand'} />
                    {this.props.header}
                </button>
            </div>
            {this.state.isExpanded &&
                (this.props.noOffset
                    ? this.props.children
                    : <div className='msp-control-offset'>
                        {this.props.children}
                    </div>)}
        </>;
    }
}