import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { ComparisonDataPoint } from './ComparisonDataPoint'
import ReactHtmlParser from 'react-html-parser';
import DOMPurify from 'dompurify';


const DataPointsWrapper = styled.div`
  font-family: "Google Sans", "Roboto", "Noto Sans JP", "Noto Sans", "Noto Sans CJK KR", Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: ${props => props.layout === 'horizontal' ? 'row' : 'column'};
  align-items: center;
  margin: 10px;
  height: 100%;
`

const dataPointGroupDirectionDict = {
  'below': 'column',
  'above': 'column-reverse',
  'left': 'row-reverse',
  'right': 'row'
}

const DataPointGroup = styled.div`
  margin: 20px 5px;
  text-align: center;
  width: 100%;
  display: flex;
  flex-shrink: ${props => props.layout === 'horizontal' ? 'auto' : 0};
  flex-direction: ${props => props.comparisonPlacement ? dataPointGroupDirectionDict[props.comparisonPlacement] : 'column'};
  align-items: center;
  justify-content: center;
`
const Divider = styled.div`
  background-color: #282828;
  height: 35vh;
  width: 1px;
`

const DataPoint = styled.div`
  display: flex;
  flex-shrink: ${props => props.layout === 'horizontal' ? 'auto' : 0};
  flex-direction: ${props => props.titlePlacement === 'above' ? 'column' : 'column-reverse'};
  flex: 1;
`

const DataPointTitle = styled.div`
  font-weight: 100;
  color: ${props => props.color};
  margin: 5px 0;
`

const DataPointValue = styled.div`
  font-size: 3em;
  font-weight: 100;
  color: ${props => props.color};

  a.drillable-link {
    color: ${props => props.color};
    text-decoration: none;
  }
  :hover {
    text-decoration: underline;
  }
`

class MultipleValue extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {}
    this.state.groupingLayout = 'horizontal';
    this.state.fontSize = this.calculateFontSize();
  }

  componentDidMount() {
    window.addEventListener('resize', this.recalculateSizing);
  }

  componentDidUpdate() {
    this.recalculateSizing();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.recalculateSizing);
  }

  getLayout = () => {
    let CONFIG = this.props.config
    if (
      CONFIG['orientation'] === 'auto' ||
      typeof CONFIG['orientation'] === 'undefined'
    ) {
      return this.state.groupingLayout
    }
    return CONFIG['orientation']
  }

  getWindowSize = () => {
    return Math.max(window.innerWidth, window.innerHeight);
  }

  calculateFontSize = () => {
    const multiplier = this.state.groupingLayout === 'horizontal' ? 0.015 : 0.02;
    return Math.round(this.getWindowSize() * multiplier);
  }

  handleClick = (cell, event) => {
    cell.link !== undefined ? LookerCharts.Utils.openDrillMenu({
      links: cell.link,
      event: event
    }) : LookerCharts.Utils.openDrillMenu({
      links: [],
      event: event
    });
  }

  recalculateSizing = () => {
    const EM = 16;
    const groupingLayout = window.innerWidth >= 768 ? 'horizontal' : 'vertical';

    let CONFIG = this.props.config;


    var font_check = CONFIG.font_size_main
    var font_size = (font_check !== "" && typeof font_check !== 'undefined' ? CONFIG.font_size_main : this.calculateFontSize());
    font_size = font_size / EM;


    this.setState({
      fontSize: font_size,
      groupingLayout
    })
  }

  render() {
    const { config, data } = this.props;

    return (
      <DataPointsWrapper
        layout={this.getLayout()}
        font={config['grouping_font']}
        style={{ fontSize: `${this.state.fontSize}em` }}
      >
        {data
          .map((dataPoint, index) => {
            // get comp data point 1
            const compDataPoint1 = dataPoint.comparison1
            let progressPerc1
            let percChange1
            if (compDataPoint1) {
              progressPerc1 = Math.round((dataPoint.value / compDataPoint1.value) * 100)
              percChange1 = progressPerc1 - 100
            }
            // get comp data point 1
            const compDataPoint2 = dataPoint.comparison2
            let progressPerc2
            let percChange2
            if (compDataPoint2) {
              progressPerc2 = Math.round((dataPoint.value / compDataPoint2.value) * 100)
              percChange2 = progressPerc2 - 100
            }
            return (
              <>
                <DataPointGroup
                  comparisonPlacement={compDataPoint1 && config[`comparison_label_placement_${compDataPoint1.name}`]}
                  key={`group_${dataPoint.name}`}
                  layout={this.getLayout()}
                >
                  <DataPoint titlePlacement={config[`title_placement_${dataPoint.name}`]}>
                    {config[`show_title_${dataPoint.name}`] === false ? null : (
                      <DataPointTitle color={config[`style_${dataPoint.name}`]} style={{ fontSize: `${config['font_size_data_point_title']}em` }}>
                        {config[`title_override_${dataPoint.name}`] || dataPoint.label}
                      </DataPointTitle>
                    )}
                    <DataPointValue
                      color={config[`style_${dataPoint.name}`]}
                      onClick={() => { this.handleClick(dataPoint, event) }}
                      layout={this.getLayout()}
                    >
                      {dataPoint.html ? ReactHtmlParser(DOMPurify.sanitize(dataPoint.html)) : dataPoint.formattedValue}
                    </DataPointValue>
                  </DataPoint>
                  {!compDataPoint1 && !compDataPoint2 ? null : (
                    <div style={{ display: 'flex', flexFlow: 'column wrap' }}>
                      {!compDataPoint1 ? null : (
                        <ComparisonDataPoint
                          config={config}
                          compDataPoint={compDataPoint1}
                          dataPoint={dataPoint}
                          percChange={percChange1}
                          progressPerc={progressPerc1}
                          handleClick={this.handleClick}
                        />)}
                      {!compDataPoint2 ? null : (
                        <ComparisonDataPoint
                          config={config}
                          compDataPoint={compDataPoint2}
                          dataPoint={dataPoint}
                          percChange={percChange2}
                          progressPerc={progressPerc2}
                          handleClick={this.handleClick}
                        />)}
                    </div>
                  )}
                </DataPointGroup>
                {config.dividers && config.orientation === 'horizontal' && index < (data.length - 1) &&
                  <Divider />
                }
              </>
            )
          })
        }
      </DataPointsWrapper>
    )

  }
}

MultipleValue.propTypes = {
  config: PropTypes.object,
  data: PropTypes.array,
};

export default MultipleValue;
