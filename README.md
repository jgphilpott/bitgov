# BitGov

BitGov is an application layer protocol built with the Python socket module. It piggybacks on the layer four Transmission Control Protocol ([TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)) in combination with the [IPv4](https://en.wikipedia.org/wiki/IPv4) address family.

## Installation

To use the BitGov protocol in your own application you may use one of the two methods listed below.

### Conda (recommended)

Assuming you have [Anaconda installed](https://docs.anaconda.com/anaconda/install/), active the environment in which you want to install the package.

```
conda activate <environment>
```

If you want to create a new environment first use `conda create --name <environment>` or if you want to see a list of all your conda environments, `conda info --envs`.

Next, install the package.

```
conda install -c jgphilpott bitgov
```

**Note**: It may be necessary to first add the channel 'jgphilpott'. To do this use `conda config --add channels jgphilpott`. To view a list of all your conda channels, `conda config --get channels`.

All done! You should now be able to see the package listed in your environment, `conda list`.

### Pip (alternative)

First, navigate into your project directory and active the environment in which you want to install the package.

```
source <environment>/bin/activate
```

If you want to create a new environment first use `virtualenv <environment>`.

Next, install the package.

```
pip install bitgov
```

**Note**: If you want to install the package locally and not in any specific environment use `pip install bitgov --user`.

All done! You should now be able to see the package listed in your environment, `pip list`.

## Usage

To get started with BitGov create a Python file for your application and import the package.

```
import bitgov
```

That's it!
