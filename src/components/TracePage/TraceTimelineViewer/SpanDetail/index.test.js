// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable import/first */
jest.mock('../utils');

import React from 'react';
import { shallow } from 'enzyme';

import AccordianKeyValues from './AccordianKeyValues';
import AccordianLogs from './AccordianLogs';
import DetailState from './DetailState';
import SpanDetail from './index';
import { formatDuration } from '../utils';
import traceGenerator from '../../../../demo/trace-generators';
import transformTraceData from '../../../../model/transform-trace-data';

describe('<SpanDetail>', () => {
  let wrapper;

  // use `transformTraceData` on a fake trace to get a fully processed span
  const span = transformTraceData(traceGenerator.trace({ numberOfSpans: 1 })).spans[0];
  const detailState = new DetailState().toggleLogs().toggleProcess().toggleTags();
  const traceStartTime = 5;
  const props = {
    detailState,
    span,
    traceStartTime,
    logItemToggle: jest.fn(),
    logsToggle: jest.fn(),
    processToggle: jest.fn(),
    tagsToggle: jest.fn(),
  };
  span.logs = [
    {
      timestamp: 10,
      fields: [{ key: 'message', value: 'oh the log message' }, { key: 'something', value: 'else' }],
    },
    {
      timestamp: 20,
      fields: [{ key: 'message', value: 'oh the next log message' }, { key: 'more', value: 'stuff' }],
    },
  ];

  beforeEach(() => {
    formatDuration.mockReset();
    props.tagsToggle.mockReset();
    props.processToggle.mockReset();
    props.logsToggle.mockReset();
    props.logItemToggle.mockReset();
    wrapper = shallow(<SpanDetail {...props} />);
  });

  it('renders without exploding', () => {
    expect(wrapper).toBeDefined();
  });

  it('shows the operation name', () => {
    expect(wrapper.find('h3').text()).toBe(span.operationName);
  });

  it('lists the service name, duration and start time', () => {
    const words = ['Service', 'Duration', 'Start Time'];
    const strongs = wrapper.find('strong');
    expect(strongs.length).toBe(3);
    strongs.forEach((strong, i) => {
      expect(strong.text()).toEqual(expect.stringContaining(words[i]));
    });
    expect(formatDuration.mock.calls).toEqual([[span.duration], [span.relativeStartTime]]);
  });

  it('renders the span tags', () => {
    const target = (
      <AccordianKeyValues data={span.tags} highContrast label="Tags" isOpen={detailState.isTagsOpen} />
    );
    expect(wrapper.containsMatchingElement(target)).toBe(true);
    wrapper.find({ data: span.tags }).simulate('toggle');
    expect(props.tagsToggle).toHaveBeenLastCalledWith(span.spanID);
  });

  it('renders the process tags', () => {
    const target = (
      <AccordianKeyValues
        data={span.process.tags}
        highContrast
        label="Process"
        isOpen={detailState.isProcessOpen}
      />
    );
    expect(wrapper.containsMatchingElement(target)).toBe(true);
    wrapper.find({ data: span.process.tags }).simulate('toggle');
    expect(props.processToggle).toHaveBeenLastCalledWith(span.spanID);
  });

  it('renders the logs', () => {
    const somethingUniq = {};
    const target = (
      <AccordianLogs
        logs={span.logs}
        isOpen={detailState.logs.isOpen}
        openedItems={detailState.logs.openedItems}
        timestamp={traceStartTime}
      />
    );
    expect(wrapper.containsMatchingElement(target)).toBe(true);
    const accordianLogs = wrapper.find(AccordianLogs);
    accordianLogs.simulate('toggle');
    accordianLogs.simulate('itemToggle', somethingUniq);
    expect(props.logsToggle).toHaveBeenLastCalledWith(span.spanID);
    expect(props.logItemToggle).toHaveBeenLastCalledWith(span.spanID, somethingUniq);
  });
});
